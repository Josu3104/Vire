// src/context/ProjectContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as projectsApi from '@/features/projects/api/projects.api';

const ProjectContext = createContext();

export function useProjects() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }) {
  const [projectsState, setProjectsState] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from real API
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getProjects();
      // data from backend will have _count for votes/comments, and authors for users
      const formatted = data.map(p => ({
        ...p,
        upvotes: p.upvotes || 0,
        downvotes: p.downvotes || 0,
        commentsCount: p._count?.comments || 0,
        author: p.authors?.[0]?.user?.name || 'Usuario',
        authorIds: p.authors?.map(a => a.user.id) || [],
        authorsData: p.authors?.map(a => a.user) || [],
        upvotedBy: [], // We'd need to fetch user's specific vote state separately in a real app, mock it for now
        downvotedBy: [],
        type: 'project',
      }));
      setProjectsState(formatted);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = useCallback(async (projectData) => {
    try {
      // For real app, projectData might be FormData if it includes files
      const newProject = await projectsApi.createProject(projectData);
      setProjectsState(prev => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error('Error creating project', error);
      throw error;
    }
  }, []);

  const toggleUpvoteProject = useCallback(async (projectId, userId) => {
    try {
      await projectsApi.voteProject(projectId, true);
      // Optimistic update
      setProjectsState(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, upvotes: p.upvotes + 1 };
      }));
    } catch (error) {
      console.error('Error upvoting', error);
    }
  }, []);

  const toggleDownvoteProject = useCallback(async (projectId, userId) => {
    try {
      await projectsApi.voteProject(projectId, false);
      // Optimistic update
      setProjectsState(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, downvotes: p.downvotes + 1 };
      }));
    } catch (error) {
      console.error('Error downvoting', error);
    }
  }, []);

  const addCommentToProject = useCallback(async (projectId, commentData) => {
    try {
      const newComment = await projectsApi.commentProject(projectId, commentData.text);
      setProjectsState(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
      }));
      return newComment;
    } catch (error) {
      console.error('Error commenting', error);
    }
  }, []);

  const updateProjectStatus = useCallback(async (projectId, status, reason = null) => {
    try {
      await projectsApi.updateProjectStatus(projectId, status, reason);
      setProjectsState(prev => prev.map(p => 
        p.id === projectId ? { ...p, status } : p
      ));
    } catch (error) {
      console.error('Error updating project status', error);
      throw error;
    }
  }, []);

  const editProject = useCallback(async (projectId, projectData) => {
    try {
      const updatedProject = await projectsApi.updateProject(projectId, projectData);
      setProjectsState(prev => prev.map(p => 
        p.id === projectId ? { ...updatedProject, status: 'Pendiente' } : p
      ));
      return updatedProject;
    } catch (error) {
      console.error('Error editing project', error);
      throw error;
    }
  }, []);

  const contextValue = useMemo(() => ({
    projectsState,
    loading,
    refreshProjects: fetchProjects,
    addProject,
    editProject,
    toggleUpvoteProject,
    toggleDownvoteProject,
    addCommentToProject,
    updateProjectStatus
  }), [projectsState, loading, fetchProjects, addProject, editProject, toggleUpvoteProject, toggleDownvoteProject, addCommentToProject, updateProjectStatus]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}
