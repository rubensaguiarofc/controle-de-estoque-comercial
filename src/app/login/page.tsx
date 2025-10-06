
import { redirect } from 'next/navigation'

export default function LoginRedirect() {
	// Server-side redirect to avoid prerendering client-only login page
	redirect('/')
}
