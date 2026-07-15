import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

function MainLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        Vehicle Number Plate Detection System &mdash; B.Tech Final Year Project
      </footer>
    </>
  );
}

export default MainLayout;
