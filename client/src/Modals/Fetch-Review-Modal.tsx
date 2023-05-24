import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import axios, { type AxiosError } from "axios";
import { Bars } from "react-loading-icons";

export default function FetchReviewModal() {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSongData = async () => {
      try {
        const email = localStorage.getItem("email");
        const response = await axios.post(
          "/api/song/start-review",
          {email},
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const { id, link, review } = response.data;
        navigate(`/song/${id}`, {
          state: {
            songId: id,
            songLink: link,
            text: review.text ?? "",
            reviewId: review.id,
          },
        });
      } catch (err: unknown | AxiosError) {
        if (axios.isAxiosError(err)) {
          if (err?.response?.status === 404) {
            navigate("/no-songs-available");
          }
          console.error("err");
          navigate("/error");
        }
      }
    };
    try {
      fetchSongData();
    } catch (err) {
      console.log("hit", err);
    }
  }, []); // should I add navigate to dependency array?

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          // navigate("/");
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Fetching a Song
                </Dialog.Title>
                <div className="flex flex-col">
                  <div>
                    <Bars fill="#4f46e5" className="m-auto w-20" speed={1} />
                  </div>
                  <div className="m-auto">
                    <h6 className="text-gray-500">
                      We&#39;re getting the next song in the review queue...
                    </h6>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
