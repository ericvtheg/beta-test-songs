import Home from "./Pages";
import ReviewModal from "./Song-Review";
import PageNotFound from "./Pages/404";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import Layout from "./Layout";
import SubmitModal from "./Submit-Modal";
import SongModal from "./Song-Modal";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="submit" element={<SubmitModal />} />
      <Route path="review" element={<ReviewModal />} />
      <Route path="song/:songId" element={<SongModal />} />
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
