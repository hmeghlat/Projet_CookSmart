import { Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './Pages/Home/HomePage'
import LoginPage from './Pages/Login/LoginPage'
import RegisterPage from './Pages/register/registerPage'
import MonFrigo from './Pages/MonFrigo/MonFrigo'
import RecettesPage from './Pages/Recettes/RecettesPage'
import RecipeDetailPage from './components/RecetteDetail/RecetteDetailPage'
import MatchPage from './Pages/Match/MatchPage'


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/mon-frigo" element={<MonFrigo />} />
      <Route path="/recettes" element={<RecettesPage />} />
      <Route path="/recettes/:id" element={<RecipeDetailPage />} />
      <Route path="/mes-matchs" element={<MatchPage />} />
    </Routes>
  )
}

export default App
