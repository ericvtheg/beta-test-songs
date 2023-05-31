import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface SubmitSongData {
  link: string | null;
  email: string | null;
}

export default function SubmitModal() {
  const [songData, setSongData] = useState<SubmitSongData>({
    link: null,
    email: null,
  });

  const navigate = useNavigate();

  const submitSong = async () => {
    try {
      if (songData.email) {
        localStorage.setItem("email", songData.email)
      }
      await axios.post("/api/song/submit-song", songData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      navigate("/song-success");
    } catch (err) {
      console.error(err);
      navigate("/error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    setSongData(() => ({
      ...songData,
      [id]: value,
    }));
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          navigate("/");
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-10"
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white pl-4 md:pl-8 pb-6 text-left align-middle shadow-xl transition-all">
                <div className="flex flex-row-reverse">
                  <Link to="/" className="">
                    <div className="px-2 pt-2">
                      <XMarkIcon className="h-5 w-6 text-gray-900 hover:text-gray-600" />
                    </div>
                  </Link>
                </div>
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 pr-6"
                >
                  Submit your song
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 pr-6">
                    Once you submit your song it'll be put into a review queue.
                    You'll be emailed once the review is complete.
                  </p>
                </div>

                <div className="w-full max-w-sm">
                  <form
                    className="bg-white px-4 pt-6 pb-4 mb-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitSong();
                    }}
                  >
                    <div className="mb-4">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="link"
                      >
                        Song Link
                      </label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-600 leading-tight focus:shadow-outline"
                        id="link"
                        type="text"
                        placeholder="soundcloud.com/your-unlisted-song"
                        onChange={handleChange}
                        pattern="^(https?:\/\/)?([\w-]+\.)?(soundcloud\.com)\/[\w-]+(\/[\w-]+)*(\/?)?(\?.*)?(#.*)?$"
                        onInvalid={(e)=>{(e.target as HTMLInputElement).setCustomValidity("Please enter a valid SoundCloud song link")}}
                        maxLength={300}
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="email"
                      >
                        Email
                      </label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-600 mb-3 leading-tight focus:shadow-outline"
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        maxLength={300}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="flex float-right justify-between">
                      <input
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:shadow-outline"
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
