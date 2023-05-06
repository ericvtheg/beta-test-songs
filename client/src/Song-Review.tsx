import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bars } from "react-loading-icons";

interface ReviewSongData {
  text: string;
  reviewId: number | null;
  trackId: number | null;
  trackLink: string | null;
}

export default function ReviewModal() {
  const [reviewData, setReviewData] = useState<ReviewSongData>({
    text: "",
    reviewId: null,
    trackId: null,
    trackLink: null,
  });

  useEffect(() => {
    const fetchTrackData = async () => {
      const response = await axios.post(
        "http://localhost:3000/song/start-review",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const { id, link, review } = response.data;
      setReviewData({
        trackId: id,
        trackLink: link,
        text: review.text,
        reviewId: review.id,
      });
    };
    fetchTrackData();
  }, []);

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    setReviewData(() => ({
      ...reviewData,
      [id]: value,
    }));
    return;
  };

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
                  Fetching a Track
                </Dialog.Title>
                <div className="flex flex-col">
                  <div>
                    <Bars fill="#4f46e5" className="m-auto w-20" speed={1} />
                  </div>
                  <div className="m-auto">
                    <h6 className="text-gray-500">
                      We&#39;re getting the next track in the review queue...
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
