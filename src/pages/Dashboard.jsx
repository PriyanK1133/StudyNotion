import React from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/core/Dashboard/Sidebar.jsx";
import Footer from "../components/common/Footer.jsx";

const Dashboard = () => {
  const { loading: profileLoading } = useSelector((state) => state.profile);
  const { loading: authLoading } = useSelector((state) => state.auth);

  if (profileLoading || authLoading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative flex flex-1 min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-11/12 max-w-[10000px] py-10">
            <Outlet />{" "}
            {/*   Outlet is used to render the child routes means jyare route /dashborad/profile to profile ne aa page ma lavi dese */}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
