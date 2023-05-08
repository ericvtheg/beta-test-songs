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
import TrackSuccessModal from "./Modals/Track-Success-Modal";
import ReviewSuccessModal from "./Modals/Review-Success-Modal";
import NoTracksAvailableModal from "./Modals/No-Tracks-Available";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="submit" element={<SubmitModal />} />
      <Route path="review" element={<FetchReviewModal />} />
      <Route path="track/:trackId" element={<SongModal />} />
      <Route path="track-success" element={<TrackSuccessModal />} />
      <Route path="review-success" element={<ReviewSuccessModal />} />
      <Route path="no-tracks-available" element={<NoTracksAvailableModal />} />
      <Route path="*" element={<PageNotFound />} />
    </Route>
  )
);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}
