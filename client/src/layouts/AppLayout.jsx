import { Outlet } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';

export default function AppLayout() {
  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>
      <AppNavbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}
