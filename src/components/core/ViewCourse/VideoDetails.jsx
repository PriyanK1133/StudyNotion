import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { BigPlayButton, Player } from "video-react";

import "video-react/dist/video-react.css";
import { markLectureAsComplete } from "../../../services/operations/courseDetailsAPI";
import { updateCompletedLectures } from "../../../slices/viewCourseSlice";
import IconBtn from "../../common/IconBtn";

const VideoDetails = () => {
  const { courseId, sectionId, subSectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerRef = useRef(null);
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { courseSectionData, courseEntireData, completedLectures } =
    useSelector((state) => state.viewCourse);

  const [videoData, setVideoData] = useState(null);
  const [previewSource, setPreviewSource] = useState("");
  const [videoEnded, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!courseSectionData.length) return;
    if (!courseId || !sectionId || !subSectionId) {
      navigate(`/dashboard/enrolled-courses`);
      return;
    }

    const section = courseSectionData.find((data) => data._id === sectionId);
    if (!section) {
      navigate(`/dashboard/enrolled-courses`);
      return;
    }

    const subSection = section.subSection.find(
      (data) => data._id === subSectionId
    );
    if (!subSection) {
      navigate(`/dashboard/enrolled-courses`);
      return;
    }

    setVideoData(subSection);
    setPreviewSource(courseEntireData.thumbnail);
    setVideoEnded(false);
  }, [courseSectionData, courseEntireData, location.pathname]);

  const isFirstVideo = () => {
    return courseSectionData[0]?.subSection[0]?._id === subSectionId;
  };

  const isLastVideo = () => {
    const lastSection = courseSectionData[courseSectionData.length - 1];
    return (
      lastSection?.subSection[lastSection.subSection.length - 1]?._id ===
      subSectionId
    );
  };

  const goToNextVideo = () => {
    if (isLastVideo()) return;
    const nextSubSectionId = courseSectionData
      .find((data) => data._id === sectionId)
      .subSection.filter((data) => data._id !== subSectionId)[0]?._id;
    navigate(
      `/view-course/${courseId}/section/${sectionId}/sub-section/${nextSubSectionId}`
    );
  };

  const goToPrevVideo = () => {
    if (isFirstVideo()) return;
    const prevSubSectionId = courseSectionData
      .find((data) => data._id === sectionId)
      .subSection.filter((data) => data._id !== subSectionId)[0]?._id;
    navigate(
      `/view-course/${courseId}/section/${sectionId}/sub-section/${prevSubSectionId}`
    );
  };

  const handleLectureCompletion = async () => {
    setLoading(true);
    try {
      const res = await markLectureAsComplete(
        { courseId, subSectionId: subSectionId },
        token
      );
      if (res) {
        dispatch(updateCompletedLectures(subSectionId));
      }
    } catch (error) {
      console.error("Error marking lecture as complete:", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-5 text-white">
      {!videoData ? (
        <img
          src={previewSource}
          alt="Preview"
          className="h-full w-full rounded-md object-cover"
        />
      ) : (
        <div
          style={{
            width: "70vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: "50px",
          }}
        >
          <Player
            style={{ width: "calc(100% - 250px)", height: "100%" }}
            ref={playerRef}
            aspectRatio="16:9"
            playsInline
            onEnded={() => setVideoEnded(true)}
            src={videoData?.videoUrl}
          >
            <BigPlayButton position="center" />
            {videoEnded && (
              <div
                style={{
                  backgroundImage:
                    "linear-gradient(to top, rgb(0, 0, 0), rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.1))",
                }}
                className="full absolute inset-0 z-[100] grid h-full place-content-center font-inter"
              >
                {!completedLectures.includes(subSectionId) && (
                  <IconBtn
                    disabled={loading}
                    onclick={handleLectureCompletion}
                    text={!loading ? "Mark As Completed" : "Loading..."}
                    customClasses="text-xl max-w-max px-4 mx-auto"
                  />
                )}
                <IconBtn
                  disabled={loading}
                  onclick={() => {
                    if (playerRef?.current) {
                      playerRef.current.seek(0);
                      setVideoEnded(false);
                    }
                  }}
                  text="Rewatch"
                  customClasses="text-xl max-w-max px-4 mx-auto mt-2"
                />
                <div className="mt-10 flex min-w-[250px] justify-center gap-x-4 text-xl">
                  {!isFirstVideo() && (
                    <button
                      disabled={loading}
                      onClick={goToPrevVideo}
                      className="blackButton"
                    >
                      Prev
                    </button>
                  )}
                  {!isLastVideo() && (
                    <button
                      disabled={loading}
                      onClick={goToNextVideo}
                      className="blackButton"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </Player>
        </div>
      )}

      <h1 className="mt-4 ml-10 text-3xl font-semibold text-center">
        {videoData?.title}
      </h1>
      <p className="pt-2 ml-10 pb-6 text-center">{videoData?.description}</p>
    </div>
  );
};

export default VideoDetails;
