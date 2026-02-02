import { useEffect, useState } from "react";
import axios from "axios";

import "./Admin.css";

const API = "http://127.0.0.1:8000";


function Admin() {

  const [summary, setSummary] = useState(null);
  const [taxis, setTaxis] = useState([]);


  useEffect(() => {

    loadAdmin();

    const timer = setInterval(loadAdmin, 5000);

    return () => clearInterval(timer);

  }, []);


  const loadAdmin = async () => {

    try {

      const s = await axios.get(`${API}/admin/summary`);
      const t = await axios.get(`${API}/admin/taxis`);

      setSummary(s.data);
      setTaxis(t.data);

    } catch (err) {

      console.error(err);
    }
  };


  return (

    <div className="admin-container">


      <h1>🛠 Admin Dashboard</h1>


      {/* SUMMARY */}
      {summary && (

        <div className="admin-stats">

          <div className="admin-card">
            Total Rides<br /><b>{summary.total_rides}</b>
          </div>

          <div className="admin-card">
            Active Taxis<br /><b>{summary.active_taxis}</b>
          </div>

          <div className="admin-card">
            Avg Reward<br /><b>{summary.avg_reward}</b>
          </div>

          <div className="admin-card">
            Avg ETA<br /><b>{summary.avg_eta} min</b>
          </div>

          <div className="admin-card">
            Revenue<br /><b>₹{summary.revenue_today}</b>
          </div>

        </div>
      )}


      {/* TAXI TABLE */}
      <div className="admin-table">

        <h3>🚕 Live Taxis</h3>

        <table>

          <thead>
            <tr>
              <th>ID</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Energy</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {taxis.map(t => (

              <tr key={t.id}>

                <td>{t.id}</td>
                <td>{t.lat.toFixed(4)}</td>
                <td>{t.lng.toFixed(4)}</td>
                <td>{t.energy}%</td>

                <td className={t.status.toLowerCase()}>
                  {t.status}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Admin;
