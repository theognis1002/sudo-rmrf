import Terminal from '../components/Terminal';
import MatrixRain from '../components/MatrixRain';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <MatrixRain />
      <Terminal />
    </div>
  );
}
