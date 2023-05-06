import Header from "./Header";
import Home from "./Home";
import SongReview from './Song-Review';
import { Routes, Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter(
  createRoutesFromElements(
    [
      <Route path="/" element={<Home />} />,
      <Route path="/review" element={<SongReview />} />
    ]
  )
)

export default function App() {
  return(
    <>
      <Header/>
      <RouterProvider router={router}/>
    </>
  )
}
