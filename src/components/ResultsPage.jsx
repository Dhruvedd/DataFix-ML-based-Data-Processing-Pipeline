import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchResults } from "../Services/api";

export default function ResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState({ confident: [], uncertain: [] });

  useEffect(() => {
    fetchResults(id)
      .then(setData)
      .catch(console.error);
  }, [id]);

  return (
    <div>
      <h2>Tickets Needing Review</h2>
      {data.uncertain.map(row => (
        <div key={row["Record ID"]} className="ticket-card">
          <h3>{row["Ticket name"]}</h3>
          <p>{row["Ticket description"]}</p>
          {/* TODO: wire up onClick to call a /label endpoint */}
          <button>Spam</button>
          <button>Valid</button>
        </div>
      ))}

      <h2>Automatically Classified</h2>
      <p>{data.confident.length} tickets confidently labeled.</p>
    </div>
  );
}
