import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { submissionsApi } from '../api/client';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';

export default function FilmSubmissionModal({ isOpen, onClose }) {
  const { showToast } = useWatchlist();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    title: '',
    director: '',
    email: '',
    url: '',
    passcode: '',
    synopsis: '',
  });

  // Pre-fill user contact info if available and form is blank
  useEffect(() => {
    if (isOpen && user) {
      setSubmissionForm((prev) => ({
        ...prev,
        director: prev.director || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !submissionForm.title.trim() ||
      !submissionForm.url.trim() ||
      !submissionForm.email.trim() ||
      !submissionForm.director.trim()
    ) {
      showToast('Please fill out all required screener details');
      return;
    }

    setIsSubmitting(true);
    try {
      await submissionsApi.create({
        filmTitle: submissionForm.title.trim(),
        directorName: submissionForm.director.trim(),
        email: submissionForm.email.trim(),
        screenerLink: submissionForm.url.trim(),
        synopsis:
          submissionForm.synopsis.trim() ||
          `Independent film submission: "${submissionForm.title.trim()}" directed by ${submissionForm.director.trim()}.${
            submissionForm.passcode.trim() ? ` Passcode: ${submissionForm.passcode.trim()}` : ''
          }`,
      });

      setSubmissionForm({
        title: '',
        director: '',
        email: '',
        url: '',
        passcode: '',
        synopsis: '',
      });
      showToast('Screener link received! Our curatorial committee will review your film.');
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      showToast(err.message || 'Failed to submit film. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#353941] bg-[#222428] flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Submit Your Film</h3>
            <p className="text-xs text-[#8A8F99] mt-0.5">
              Share your screener with the Aspectt curatorial board
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#B8BCC4] hover:text-white p-1 rounded-md hover:bg-[#353941] transition-colors cursor-pointer"
            aria-label="Close submit film modal"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
              Film Title *
            </label>
            <input
              type="text"
              required
              value={submissionForm.title}
              onChange={(e) =>
                setSubmissionForm({ ...submissionForm, title: e.target.value })
              }
              placeholder="e.g. Nocturne in Pale Blue"
              className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                Director / Filmmaker *
              </label>
              <input
                type="text"
                required
                value={submissionForm.director}
                onChange={(e) =>
                  setSubmissionForm({ ...submissionForm, director: e.target.value })
                }
                placeholder="e.g. Claire Laurent"
                className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2]"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={submissionForm.email}
                onChange={(e) =>
                  setSubmissionForm({ ...submissionForm, email: e.target.value })
                }
                placeholder="director@studio.com"
                className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                Screener URL *
              </label>
              <input
                type="url"
                required
                value={submissionForm.url}
                onChange={(e) =>
                  setSubmissionForm({ ...submissionForm, url: e.target.value })
                }
                placeholder="https://vimeo.com/..."
                className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                Passcode / Access Key
              </label>
              <input
                type="text"
                value={submissionForm.passcode}
                onChange={(e) =>
                  setSubmissionForm({ ...submissionForm, passcode: e.target.value })
                }
                placeholder="If password-protected"
                className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
              Synopsis & Production Notes
            </label>
            <textarea
              rows="3"
              value={submissionForm.synopsis}
              onChange={(e) =>
                setSubmissionForm({ ...submissionForm, synopsis: e.target.value })
              }
              placeholder="Tell us about the project, camera format (e.g., 16mm/35mm), and any festival credentials..."
              className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#353941]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#B8BCC4] hover:text-white border border-[#353941] hover:bg-[#353941]/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SendOutlinedIcon sx={{ fontSize: 14 }} />
              )}
              <span>{isSubmitting ? 'Submitting...' : 'Send Screener Link'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

