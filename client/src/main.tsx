import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
)

if (import.meta.env.DEV) {
	document.getElementById('favicon')?.setAttribute('href', '/favicon-y.ico');
}

let btsUuid = localStorage.getItem('bts_uuid');
if (!btsUuid){
  btsUuid = uuidv4();
  localStorage.setItem('bts_uuid', btsUuid);
}
axios.defaults.headers.common['BtsUuid'] = btsUuid;