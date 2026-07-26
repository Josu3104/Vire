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

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getProjects();
      const formatted = data.map(p => ({
        ...p,
        upvotes: p.upvotes || 0,
        downvotes: p.downvotes || 0,
        commentsCount: p._count?.comments || 0,
        author: p.authors?.[0]?.user?.name || 'Usuario',
        authorIds: p.authors?.map(a => a.user.id) || [],
        authorsData: p.authors?.map(a => ({
          ...a.user,
          avatar: a.user.avatarUrl || null,
        })) || [],
        // upvotedBy / downvotedBy come from backend mapLegacyFields
        upvotedBy: p.upvotedBy || [],
        downvotedBy: p.downvotedBy || [],
        comments: p.comments || [],
        // coverImage comes from mapLegacyFields on backend
        coverImage: p.coverImage || null,
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
      const newProject = await projectsApi.createProject(projectData);
      // Map backend response to frontend shape (same as fetchProjects)
      const endpoint = newProject.files?.[0]?.downloadUrl?.split('/vire-storage/')?.[0] || '';
      const coverFile = newProject.files?.find(f => f.type === 'COVER' || f.type === 'IMAGE');
      const pdfFile = newProject.files?.find(f => f.type === 'PDF');
      const cadFile = newProject.files?.find(f => f.type === 'CAD');
      const mapped = {
        ...newProject,
        upvotes: newProject.upvotes || 0,
        downvotes: newProject.downvotes || 0,
        author: newProject.authors?.[0]?.user?.name || 'Usuario',
        authorIds: newProject.authors?.map(a => a.user?.id || a.userId) || [],
        authorsData: newProject.authors?.map(a => ({
          ...(a.user || {}),
          avatar: a.user?.avatarUrl || null,
        })) || [],
        upvotedBy: [],
        downvotedBy: [],
        comments: [],
        coverImage: coverFile ? coverFile.downloadUrl : null,
        pdfLink: pdfFile ? pdfFile.downloadUrl : null,
        cadLink: cadFile ? cadFile.downloadUrl : null,
      };
      setProjectsState(prev => [mapped, ...prev]);
      return mapped;
    } catch (error) {
      console.error('Error creating project', error);
      throw error;
    }
  }, []);

  const toggleUpvoteProject = useCallback(async (projectId, userId) => {
    try {
      const result = await projectsApi.voteProject(projectId, true);
      setProjectsState(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        const alreadyUp = p.upvotedBy?.includes(userId);
        const alreadyDown = p.downvotedBy?.includes(userId);
        if (alreadyUp) {
          // toggle off
          return { ...p,
            upvotes: result.upvotes ?? p.upvotes - 1,
            downvotes: result.downvotes ?? p.downvotes,
            upvotedBy: p.upvotedBy.filter(id => id !== userId),
          };
        } else {
          return { ...p,
            upvotes: result.upvotes ?? p.upvotes + 1,
            downvotes: result.downvotes ?? (alreadyDown ? p.downvotes - 1 : p.downvotes),
            upvotedBy: [...(p.upvotedBy || []), userId],
            downvotedBy: (p.downvotedBy || []).filter(id => id !== userId),
          };
        }
      }));
    } catch (error) {
      console.error('Error upvoting', error);
    }
  }, []);

  const toggleDownvoteProject = useCallback(async (projectId, userId) => {
    try {
      const result = await projectsApi.voteProject(projectId, false);
      setProjectsState(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        const alreadyDown = p.downvotedBy?.includes(userId);
        const alreadyUp = p.upvotedBy?.includes(userId);
        if (alreadyDown) {
          return { ...p,
            downvotes: result.downvotes ?? p.downvotes - 1,
            upvotes: result.upvotes ?? p.upvotes,
            downvotedBy: p.downvotedBy.filter(id => id !== userId),
          };
        } else {
          return { ...p,
            downvotes: result.downvotes ?? p.downvotes + 1,
            upvotes: result.upvotes ?? (alreadyUp ? p.upvotes - 1 : p.upvotes),
            downvotedBy: [...(p.downvotedBy || []), userId],
            upvotedBy: (p.upvotedBy || []).filter(id => id !== userId),
          };
        }
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
        const builtComment = {
          id: newComment?.id || Date.now(),
          userId: commentData.userId,
          userName: commentData.userName || newComment?.user?.name || 'Tú',
          avatar: commentData.avatar || newComment?.user?.avatarUrl || null,
          text: commentData.text,
          createdAt: newComment?.createdAt || new Date().toISOString(),
          isHiddenByAuthor: false,
        };
        return {
          ...p,
          commentsCount: (p.commentsCount || 0) + 1,
          comments: [...(p.comments || []), builtComment],
        };
      }));
      return newComment;
    } catch (error) {
      console.error('Error commenting', error);
      throw error;
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
