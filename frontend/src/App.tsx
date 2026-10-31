import { FamilyProvider } from './context/FamilyContext';
import { AlbumApp } from './album/AlbumApp';

export function App() {
  return (
    <FamilyProvider>
      <AlbumApp />
    </FamilyProvider>
  );
}

export default App;
