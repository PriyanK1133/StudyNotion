import React from "react";
import { useState } from "react";
import { VscSignOut } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { sidebarLinks } from "../../../data/dashboard-links";
import { logout } from "../../../services/operations/authAPI";
import ConfirmationModal from "../../common/ConfirmationModal";
import SidebarLink from "./SidebarLink";

import * as Icons from "react-icons/vsc";

const Sidebar = () => {
  const { user, loading: profileLoading } = useSelector(
    (state) => state.profile
  );
  const { loading: authLoading } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [confirmationModal, setConfirmationModal] = useState(null);

  if (profileLoading || authLoading) {
    return (
      <div className="gird h-[calc(100vh-3.5rem)] min-w-[220px] items-center border-r-[1px] border-r-richblack-700 bg-richblack-800">
        <div className="spinner"></div>
      </div>
    );
  }

  // Function to get the appropriate icon component based on icon name
  const getIconComponent = (iconName, color) => {
    const Icon = Icons[iconName]; // Get the corresponding icon component
    if (Icon) {
      return <Icon color={color} className="text-2xl" />; // Pass the color prop to the icon component
    } else {
      // Return a default icon or null if the icon is not found
      return null;
    }
  };

  return (
    <>
      <div className="lg:flex min-h-screen min-w-[220px] flex-col border-r-[1px] border-r-richblack-700 bg-richblack-800 py-10 hidden">
        <div className="flex flex-col">
          {sidebarLinks.map((link) => {
            if (link.type && user?.accountType !== link.type) return null;
            return (
              <SidebarLink key={link.id} link={link} iconName={link.icon} />
            );
          })}
        </div>
        <div className="mx-auto mt-6 mb-6 h-[1px] w-10/12 bg-richblack-700" />
        <div className="flex flex-col">
          <SidebarLink
            link={{ name: "Settings", path: "/dashboard/settings" }}
            iconName="VscSettingsGear"
          />
          <button
            onClick={() =>
              setConfirmationModal({
                text1: "Are you sure?",
                text2: "You will be logged out of your account.",
                btn1Text: "Logout",
                btn2Text: "Cancel",
                btn1Handler: () => dispatch(logout(navigate)),
                btn2Handler: () => setConfirmationModal(null),
              })
            }
            className="px-8 py-2 text-sm font-medium text-richblack-300"
          >
            <div className="flex items-center gap-x-2">
              <VscSignOut className="text-lg" />
              <span>Logout</span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom navigation for small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-richblack-800 border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium flex-wrap-none">
          {" "}
          {/* Add flex-wrap-none class */}
          {sidebarLinks.map((link) =>
            // Check if link.type exists and user's account type matches link type
            link.type && user?.accountType !== link.type ? null : (
              <button
                key={link.id}
                type="button"
                className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                onClick={() => navigate(link.path)}
              >
                {getIconComponent(link.icon, "#FFFFFF")}{" "}
                {/* Render the icon component */}
              </button>
            )
          )}
          {user?.accountType !== "Instructor" && (
            <button
              type="button"
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
              onClick={() => navigate("/dashboard/settings")}
            >
              <Icons.VscSettings color="#FFFFFF" className="text-2xl" />
            </button>
          )}
        </div>
      </div>

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
};

export default Sidebar;
