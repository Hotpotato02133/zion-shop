import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Star,
  MessageSquarePlus,
} from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';
import {
  getOrGenerateReviewSummary,
  fetchProductReviews,
  submitProductReview,
} from '../../services/reviewSummaryService';

export function AiReviewSummaryCard({ product }) {
  const { user } = useUser();
  const { supabase } = useSupabase();

  const [summary, setSummary] = useState(product?.ai_review_summary || null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!product) return undefined;

    setLoading(true);
    Promise.all([
      getOrGenerateReviewSummary(product, supabase, false),
      fetchProductReviews(product, supabase),
    ])
      .then(([summaryData, reviewList]) => {
        if (!isMounted) return;
        setSummary(summaryData);
        setReviews(reviewList || []);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product, supabase]);

  const handleRefreshSummary = async () => {
    if (!product || loading) return;
    setLoading(true);
    try {
      const refreshed = await getOrGenerateReviewSummary(product, supabase, true);
      setSummary(refreshed);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await submitProductReview(
        {
          product,
          userId: user?.id,
          authorName:
            user?.fullName ||
            user?.firstName ||
            user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
            'Atelier Client',
          rating,
          comment,
        },
        supabase
      );
      setComment('');
      setShowWriteForm(false);
      const updatedReviews = await fetchProductReviews(product, supabase);
      setReviews(updatedReviews);
      const refreshedSummary = await getOrGenerateReviewSummary(product, supabase, true);
      setSummary(refreshedSummary);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="p-4 border border-neutral-200 bg-neutral-50 text-xs text-neutral-500 animate-pulse mb-6">
        Synthesizing verified client reviews with Zion AI...
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-4 sm:p-5 border border-neutral-200 bg-neutral-50/70 space-y-3.5 mb-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Client Consensus</span>
          {reviews.length > 0 && (
            <span className="text-neutral-400 font-normal">
              ({reviews.length} Verified)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefreshSummary}
          disabled={loading}
          title="Re-synthesize AI review summary"
          className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-black inline-flex items-center gap-1 transition-colors disabled:opacity-40"
        >
          <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <p className="text-xs sm:text-sm font-medium text-neutral-900 leading-relaxed">
        {summary.headline}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5 bg-white p-3 border border-neutral-200/80">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
            Highlights (Pros)
          </span>
          {summary.pros?.map((pro, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-neutral-800">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-black" />
              <span>{pro}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 bg-white p-3 border border-neutral-200/80">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 block">
            Fit &amp; Care Notes
          </span>
          {summary.cons?.map((con, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-neutral-600">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neutral-500" />
              <span>{con}</span>
            </div>
          ))}
        </div>
      </div>

      {summary.recommendedFor && (
        <p className="text-[11px] text-neutral-600 pt-2 border-t border-neutral-200">
          <strong className="text-black uppercase tracking-wider text-[10px] mr-1.5">
            Best For:
          </strong>
          {summary.recommendedFor}
        </p>
      )}

      {/* Expandable Verified Reviews & Write Review Toggle */}
      <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowReviews((prev) => !prev)}
          className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 hover:text-black inline-flex items-center gap-1 transition-colors"
        >
          <span>{showReviews ? 'Hide Client Reviews' : `Read ${reviews.length} Reviews`}</span>
          {showReviews ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowWriteForm((prev) => !prev)}
          className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 hover:text-black inline-flex items-center gap-1 transition-colors"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>{showWriteForm ? 'Cancel' : 'Add Review'}</span>
        </button>
      </div>

      {showWriteForm && (
        <form
          onSubmit={handleReviewSubmit}
          className="p-3 bg-white border border-neutral-200 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Your Rating
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-0.5 text-black"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      star <= rating ? 'fill-black text-black' : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on fit, fabric weight, and styling..."
            className="w-full border border-neutral-200 p-2 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="w-full py-2 bg-black text-white text-[10px] font-semibold uppercase tracking-[0.18em] hover:bg-neutral-800 disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Updating AI Consensus...' : 'Submit & Refresh AI Summary'}
          </button>
        </form>
      )}

      {showReviews && reviews.length > 0 && (
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1 pt-1">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-2.5 bg-white border border-neutral-200/80 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">
                  {rev.author_name || 'Verified Client'}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {'★'.repeat(Number(rev.rating || 5))}
                </span>
              </div>
              <p className="text-neutral-600 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AiReviewSummaryCard;
