import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface ReviewSongData {
  text: string;
  trackId: number | null;
  trackLink: string | null;
}

export default function ReviewModal() {
  const [reviewData, setReviewData] = useState<ReviewSongData>({
    text: "",
    trackId: null,
    trackLink: null,
  });

  useEffect(() => {
    const fetchTrackData = async () => {
      const response = await axios
        .post("http://localhost:3000/song/start-review", {}, {
          headers: {
            "Content-Type": "application/json",
          },
        })
      const {id, link, review } = response.data;
      setReviewData({
        trackId: id,
        trackLink: link,
        text: review.text
      })
    }
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
                  Review a Track
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Leave some constructive criticism.
                  </p>
                </div>

                <div className="w-full max-w-md">
                  <form
                    className="bg-white px-4 pt-6 pb-4 mb-4"
                    onSubmit={() => ""}
                  >
                    <div className="sm:col-span-4 mb-4">
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Track Link
                      </label>
                      <div className="mt-2">
                        <div className="flex px-1.5 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md overflow-auto">
                          <span className="flex select items-center pl-3 text-gray-500 sm:text-sm">
                            {reviewData.trackLink ?? "Loading..."}
                          </span>
                          {/* <input
                            type="text"
                            name="username"
                            id="username"
                            autoComplete="username"
                            className="block flex-1 border-0 bg-transparent py-1.5 pl-1 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                            placeholder={reviewData.trackLink ?? "Loading..."}
                            disabled={true}
                          /> */}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-full mb-4">
                      <label
                        htmlFor="about"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Review
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="about"
                          name="about"
                          rows={5}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          defaultValue={""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="flex float-right justify-between">
                      <input
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit"
                        value="Submit"
                      />
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
