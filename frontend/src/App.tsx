import { FamilyProvider } from './context/FamilyContext';
import { AlbumApp } from './album/AlbumApp';
import { FamilyGate } from './album/FamilyGate';

export function App() {
  return (
    <FamilyGate>
      <FamilyProvider>
        <AlbumApp />
      </FamilyProvider>
    </FamilyGate>
  );
}

export default App;
