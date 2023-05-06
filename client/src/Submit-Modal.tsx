import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";

interface SubmitSongData {
  link: string | null;
  email: string | null;
}

function submitSong(data: SubmitSongData) {
  axios
    .post("http://localhost:3000/song/submit-song", data, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => alert(response)) //TODO should call to action to review track
    .catch((err) => console.error(err));
}

interface SubmitModalProps {
  isOpen: boolean;
  openOrCloseModal: () => void;
}

export default function SubmitModal({
  isOpen,
  openOrCloseModal,
}: SubmitModalProps) {
  const [songData, setSongData] = useState<SubmitSongData>({
    link: null,
    email: null,
  });

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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={openOrCloseModal}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Submit your track
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Once you submit your track it'll be put into a review queue.
                    You'll be emailed once it's been reviewed.
                  </p>
                </div>

                <div className="w-full max-w-sm">
                  <form
                    className="bg-white px-4 pt-6 pb-4 mb-4"
                    onSubmit={() => submitSong(songData)}
                  >
                    <div className="mb-4">
                      <label
                        className="block text-gray-700 text-sm font-bold mb-2"
                        htmlFor="link"
                      >
                        Song Link 
                      </label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="link"
                        type="text"
                        placeholder="soundcloud.com/xxxx"
                        onChange={handleChange}
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
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        onChange={handleChange}
                        required
                      />
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
