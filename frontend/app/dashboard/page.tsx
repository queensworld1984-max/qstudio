'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Folder, Plus, Play, Clock, FileText, Users } from 'lucide-react'
import { projectsAPI } from '@/lib/api'

interface Project {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchProjects()
    fetchUser()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.list()
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const stats = [
    { name: 'Total Projects', value: projects.length, icon: Folder },
    { name: 'Active Scenes', value: '0', icon: Play },
    { name: 'Hours Rendered', value: '0', icon: Clock },
    { name: 'Scripts', value: '0', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here&apos;s an overview of your film production projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Your Projects</h2>
          <Link
            href="/projects"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </div>

        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-center">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project</p>
            <div className="mt-6">
              <Link
                href="/projects"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="block hover:bg-gray-50 px-6 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Folder className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {project.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.description || 'No description'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : project.status === 'archived'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status}
                      </span>
                      <span className="ml-4 text-sm text-gray-500">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/identity"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Users className="h-8 w-8 text-primary mr-3" />
            <div>
              <div className="font-medium text-gray-900">Create Character</div>
              <div className="text-sm text-gray-500">Build your first identity</div>
            </div>
          </Link>
          <Link
            href="/scenes"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Play className="h-8 w-8 text-primary mr-3" />
            <div>
              <div className="font-medium text-gray-900">New Scene</div>
              <div className="text-sm text-gray-500">Start a new scene</div>
            </div>
          </Link>
          <Link
            href="/script"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <FileText className="h-8 w-8 text-primary mr-3" />
            <div>
              <div className="font-medium text-gray-900">Write Script</div>
              <div className="text-sm text-gray-500">Create a new screenplay</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
