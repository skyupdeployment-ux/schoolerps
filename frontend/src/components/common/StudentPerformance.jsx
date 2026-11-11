import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import StarRating from './StarRating';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// Call right after a NEW student has been created, to save the rating/description
// that were filled in on the Add Student form.   pending = perfRef.current
export async function saveStudentPerformance(studentId, pending) {
  if (!studentId || !pending) return;
  if (pending.rating) {
    try {
      await api.put(`/students/${studentId}/performance`, { rating: pending.rating, description: pending.description || '' });
    } catch (err) {
      toast.error(`Student saved, but the rating could not be saved (${err.response?.data?.message || 'error'}). Open Edit to add it.`);
    }
  } else if (pending.description?.trim()) {
    toast.error('Student saved, but the description was not saved. Select a star rating too (open Edit).');
  }
}

// Star rating + performance description for one student.
//   student    = the student being edited, or null on the Add Student form
//   onChange   = (edit mode) called with { performance } after saving
//   pendingRef = (add mode)  a useRef that keeps the chosen rating/description
export default function StudentPerformance({ student, onChange, pendingRef }) {
  const isNew = !student?._id;
  const [rating, setRating] = useState(student?.performance?.rating || 0);
  const [description, setDescription] = useState(student?.performance?.description || '');
  const [saving, setSaving] = useState(false);

  // Edit mode: reload only when a different student is opened
  useEffect(() => {
    setRating(student?.performance?.rating || 0);
    setDescription(student?.performance?.description || '');
  }, [student?._id]);

  // Add mode: hand the values to the parent so it can save them after the student is created
  useEffect(() => {
    if (isNew && pendingRef) pendingRef.current = { rating, description };
  }, [isNew, rating, description]);

  const save = async () => {
    if (!rating) return toast.error('Please select a star rating first');
    setSaving(true);
    try {
      const res = await api.put(`/students/${student._id}/performance`, { rating, description });
      onChange?.({ performance: res.data.data });
      toast.success('Performance saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save performance'); }
    finally { setSaving(false); }
  };

  const reviewedAt = student?.performance?.reviewedAt;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Performance</h3>
      <div className="flex items-center gap-3">
        <StarRating value={rating} onChange={setRating} size={26} />
        <span className="text-sm text-gray-500">{rating ? `${rating} / 5 - ${RATING_LABELS[rating]}` : 'Click a star to rate'}</span>
      </div>
      <label className="label mt-3">Performance description</label>
      <textarea
        rows={3}
        maxLength={1000}
        className="input-field"
        placeholder="Academics, behaviour, attendance, strengths, areas to improve..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">
          {isNew
            ? `Saved when you click Add Student · ${description.length}/1000`
            : `${reviewedAt ? `Last reviewed ${new Date(reviewedAt).toLocaleDateString()}` : 'Not reviewed yet'} · ${description.length}/1000`}
        </p>
        {!isNew && (
          <button type="button" className="btn-primary" disabled={saving} onClick={save}>
            {saving ? <><Loader size={14} className="animate-spin" /> Saving...</> : 'Save performance'}
          </button>
        )}
      </div>
    </div>
  );
}