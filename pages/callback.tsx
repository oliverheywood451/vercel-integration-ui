import { useEffect, useState } from 'react'
import * as React from "react";
import { useRouter } from 'next/router'
import Layout from '../components/common/layout';
import { VercelTokenContext } from '../types/VercelTokenContext';
import { VercelProject } from '../types/VercelProject';
import SplashView from '../components/common/SplashView';
import LoginView from '../components/common/LoginView';
import RegisterView from '../components/common/RegisterView';
import { PortalAuthentication } from '@ordercloud/portal-javascript-sdk/dist/models/PortalAuthentication';
import ForgotPasswordView from '../components/common/ForgotPasswordView';

export type View = 'SPLASH_PAGE' | 'REGISTER' | 'LOGIN' | 'FORGOT_PASS' | 'SEEDING'

export default function CallbackPage() {
  const router = useRouter()
  const [vercelToken, setVercelToken] = useState<VercelTokenContext>({})
  const [ocToken, setOCToken] = useState<PortalAuthentication>(null)
  const [vercelProjects, setVercelProjects] = useState<VercelProject[]>()
  const [view, setView] = useState<View>('SPLASH_PAGE')

  useEffect(() => {
    const fetchAccessToken = async (code) => {
      const res = await fetch(`/api/get-access-token?code=${code}`)
      const json = await res.json()

      setVercelToken({
        accessToken: json.access_token,
        userId: json.user_id,
        teamId: json.team_id
      })
    }

    if (router.isReady && !vercelToken.accessToken) {
      const { code } = router.query
      fetchAccessToken(code)
    }
  }, [router])

  useEffect(() => {
    const fetchProjects = async (accessToken, teamId) => {
      if (accessToken) {
        {/* If we have a teamId, all calls to the Vercel API should have it attached as a query parameter */ }
        const res = await fetch(`https://api.vercel.com/v8/projects${teamId ? `?teamId=${teamId}` : ''}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        const json = await res.json()

        setVercelProjects(json.projects)
      }
    }

    const { accessToken, teamId } = vercelToken
    fetchProjects(accessToken, teamId)
  }, [vercelToken])

  const onAuthenticate = async (auth: PortalAuthentication) => {
    setOCToken(auth);
    setView('SEEDING');
  }

  return (
    <Layout>
      {view === 'SPLASH_PAGE' && <SplashView setView={setView} />}
      {view === 'LOGIN' && (
        <LoginView setView={setView} onAuthenticate={onAuthenticate}/>
      )}
      {view === 'REGISTER' && (
        <RegisterView setView={setView} onAuthenticate={onAuthenticate} />
      )}
      {view === 'FORGOT_PASS' && (
        <ForgotPasswordView setView={setView} />
      )}
      {view === 'SEEDING' && (
        <div>Seeding {ocToken?.access_token}</div>
      )}
    </Layout>
  )
}
