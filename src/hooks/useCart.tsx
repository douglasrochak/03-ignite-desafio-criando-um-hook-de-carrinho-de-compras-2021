import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const productAlreadyInCart = newCart.find(
        (product) => product.id === productId
      );

      if (productAlreadyInCart) {
        const stock = await api.get(`http://localhost:3333/stock/${productId}`);
        const stockAmount = stock.data?.amount;
        const productAmount = productAlreadyInCart.amount + 1;

        if (productAmount > stockAmount) {
          toast.error('Erro na adição do produto');
          return;
        }

        productAlreadyInCart.amount = productAmount;
      } else {
        const response = await api.get(
          `http://localhost:3333/products/${productId}`
        );
        const product = response.data;
        newCart.push({ ...product, amount: 1 });
      }
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const productExists = newCart.find((product) => product.id === productId);
      if (productExists) {
        const removeProductFromCart = newCart.filter(
          (product) => product.id !== productId
        );
        setCart(removeProductFromCart);
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(removeProductFromCart)
        );
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = [...cart];
      const productExists = newCart.find((product) => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
