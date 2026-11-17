import { Outlet } from "react-router-dom";

function ProtectedRoute() {
  // Libera a passagem direta sem barrar ninguém
  return <Outlet />;
}

export default ProtectedRoute;