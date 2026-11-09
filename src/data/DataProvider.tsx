// Abre las dos bases de datos al arrancar y las expone a las pantallas:
//  - reference: base aeronáutica incluida en la app (solo lectura).
//  - user: vuelos y aeronaves del usuario (flightnote.db, con migraciones).
import { randomUUID } from 'expo-crypto';
import { importDatabaseFromAssetAsync, openDatabaseAsync } from 'expo-sqlite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import referenceAsset from '../../assets/data/reference.sqlite';
import { ReferenceRepository } from './referenceRepository';
import { REFERENCE_DB_FILENAME } from './referenceVersion.generated';
import { UserRepository } from './userRepository';
import { migrateUserDb } from './userSchema';

export interface AppData {
  reference: ReferenceRepository;
  user: UserRepository;
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: AppData }
  | { status: 'error'; error: Error };

const DataContext = createContext<AppData | null>(null);

async function openAppData(): Promise<AppData> {
  // `importDatabaseFromAssetAsync` es la función que usa internamente <SQLiteProvider assetSource>.
  // Solo copia el fichero si no existe; el nombre versionado garantiza que cada base nueva se instale.
  await importDatabaseFromAssetAsync(REFERENCE_DB_FILENAME, {
    assetId: referenceAsset,
  });
  const referenceDb = await openDatabaseAsync(REFERENCE_DB_FILENAME);
  const userDb = await openDatabaseAsync('flightnote.db');
  await migrateUserDb(userDb);
  return {
    reference: new ReferenceRepository(referenceDb),
    user: new UserRepository(userDb, { newId: randomUUID }),
  };
}

export function DataProvider({
  children,
  fallback,
  renderError,
}: {
  children: ReactNode;
  fallback: ReactNode;
  renderError: (error: Error) => ReactNode;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    openAppData().then(
      (data) => !cancelled && setState({ status: 'ready', data }),
      (error: unknown) =>
        !cancelled &&
        setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') return fallback;
  if (state.status === 'error') return renderError(state.error);
  return <DataContext.Provider value={state.data}>{children}</DataContext.Provider>;
}

export function useAppData(): AppData {
  const data = useContext(DataContext);
  if (!data) throw new Error('useAppData debe usarse dentro de <DataProvider>.');
  return data;
}
