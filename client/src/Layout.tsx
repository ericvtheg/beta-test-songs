import Header from "./Header";
import Background from "./Background";
import { Outlet } from 'react-router-dom';

export default function Layout() {

  return (
    <>
      <Header/>
      <Background/>
      <Outlet/>
    </>
  )
}