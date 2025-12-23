import { EditorLayout } from './components/EditorLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts();

  return (
    <div className="h-screen w-screen overflow-hidden">
      <EditorLayout />
    </div>
  );
}

export default App;