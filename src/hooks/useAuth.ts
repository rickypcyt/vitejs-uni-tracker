import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '../redux/authSlice';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const hasShownToast = useRef(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      dispatch(session ? setUser(session.user) : clearUser());

      if (session && !hasShownToast.current) {
        toast.dismiss(); // 🔥 Elimina cualquier toast atascado
        toast.success("🔑 You have successfully logged in!", {
          position: "top-right",
          autoClose: 4000,
          theme: "dark"
        });
        hasShownToast.current = true;
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      dispatch(session ? setUser(session.user) : clearUser());
      
      if (session && !hasShownToast.current) {
        toast.dismiss(); // 🔥 Limpia toasts antes de mostrar uno nuevo
        toast.success("🔑 You have successfully logged in!", {
          position: "top-right",
          autoClose: 4000,
          theme: "dark",
          hideProgressBar: true // 🔥 Oculta la barra de progreso
        });
        
        hasShownToast.current = true;
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [dispatch]);

  const loginWithGoogle = async () => {
    try {
      toast.dismiss(); // 🔥 Limpia cualquier mensaje anterior antes de login
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        toast.error(`Error: ${error.message}`, {
          position: "top-right",
          autoClose: 4000,
          theme: "dark"
        });
        throw error;
      }
    } catch (error) {
      console.error('Google Login Error:', error);
    }
  };

  return { isLoggedIn, loginWithGoogle };
};
