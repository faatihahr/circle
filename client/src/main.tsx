import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { FollowProvider } from './contexts/FollowContext.tsx'
import { Provider } from 'react-redux'
import { store } from './stores/store.ts'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <AuthProvider>
      <FollowProvider>
        <App />
      </FollowProvider>
    </AuthProvider>
  </Provider>,
)
