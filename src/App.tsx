import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/navigation/Navbar';
import { AppRoutes } from './components/navigation/AppRoutes';
import { Footer } from './components/Footer';

export function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
