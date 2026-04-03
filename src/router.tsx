import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import GalleryPage from './pages/GalleryPage';
import DirectoriesPage from './pages/DirectoriesPage';

// Placeholder Pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="text-center">
      <h2 className="text-2xl font-['Space_Grotesk'] text-[var(--text-secondary)]">{title}</h2>
      <p className="text-[var(--text-muted)] mt-2">Próximamente</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/gallery" replace />
      },
      {
        path: 'gallery',
        element: <GalleryPage />
      },
      {
        path: 'directories',
        element: <DirectoriesPage />
      },
      {
        path: 'albums',
        element: <PlaceholderPage title="Álbumes" />
      },
      {
        path: 'faces',
        element: <PlaceholderPage title="Personas" />
      },
      {
        path: 'map',
        element: <PlaceholderPage title="Mapa" />
      },
      {
        path: 'trash',
        element: <PlaceholderPage title="Papelera" />
      }
    ]
  }
]);
