import { useState } from "react";
import Phase1 from "./components/Phase1";
import Phase2Editor from "./components/Phase2Editor";
import Phase3Testing from "./components/Phase3Testing";

export default function App() {
  const [phase, setPhase] = useState(1);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState("tcp");
  const [procedures, setProcedures] = useState([]);

  return (
    <>
      {phase === 1 && (
        <Phase1
          selectedProtocol={selectedProtocol}
          setSelectedProtocol={setSelectedProtocol}
          selectedTransport={selectedTransport}
          setSelectedTransport={setSelectedTransport}
          onNext={() => setPhase(2)}
        />
      )}

      {phase === 2 && (
        <Phase2Editor
          selectedProtocol={selectedProtocol}
          selectedTransport={selectedTransport}
          procedures={procedures}
          setProcedures={setProcedures}
          onBack={() => setPhase(1)}
          onNext={() => setPhase(3)}
        />
      )}

      {phase === 3 && (
        <Phase3Testing
          selectedProtocol={selectedProtocol}
          selectedTransport={selectedTransport}
          procedures={procedures}
          onBack={() => setPhase(2)}
        />
      )}
    </>
  );
}

