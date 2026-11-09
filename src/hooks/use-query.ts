import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta una consulta asíncrona cada vez que la pantalla gana el foco.
 * `reload()` la relanza a mano (p. ej., tras guardar algo en la misma pantalla).
 * La consulta se lee de una ref: pasar una función nueva en cada render no la relanza.
 */
export function useFocusQuery<T>(query: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query;
  });

  const load = useCallback(() => {
    let active = true;
    queryRef.current().then(
      (result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      },
      (e: unknown) => {
        if (active) setError(e instanceof Error ? e : new Error(String(e)));
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  return { data, error, reload: load };
}
