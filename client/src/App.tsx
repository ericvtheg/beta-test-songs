import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import Home from "./Pages";
import Layout from "./Layout";
import FetchReviewModal from "./Modals/Fetch-Review-Modal";
import PageNotFound from "./Pages/404";
import SubmitModal from "./Modals/Submit-Modal";
import SongModal from "./Modals/Song-Modal";
import SongSuccessModal from "./Modals/Song-Success-Modal";
import ReviewSuccessModal from "./Modals/Review-Success-Modal";
import NoSongsAvailableModal from "./Modals/No-Songs-Available";
import Error from "./Pages/Error";
import { useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="submit" element={<SubmitModal />} />
      <Route path="review" element={<FetchReviewModal />} />
      <Route path="song/:songId" element={<SongModal />} />
      <Route path="song-success" element={<SongSuccessModal />} />
      <Route path="review-success" element={<ReviewSuccessModal />} />
      <Route path="no-songs-available" element={<NoSongsAvailableModal />} />
      <Route path="error" element={<Error />} />
      <Route path="*" element={<PageNotFound />} />
    </Route>
  )
);

export default function App() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      document.getElementById('favicon')?.setAttribute('href', '/favicon-y.ico');
    }

    let firstVisit = false;
    let distinctId = localStorage.getItem('distinct_id');
    if (!distinctId){
      distinctId = uuidv4();
      localStorage.setItem('distinct_id', distinctId);
      firstVisit = true;
    }
    axios.defaults.headers.common['Distinct-Id'] = distinctId;

    const trackVisit = async (firstVisit: boolean) => {
      try{
        if (firstVisit) {
          await axios.post("/api/visit/first");
        } else {
          await axios.post("/api/visit")
        }
      } catch (err) {
        console.error("Failed to inform server of visit")
      }
    }
    trackVisit(firstVisit);
  }, [])

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}
