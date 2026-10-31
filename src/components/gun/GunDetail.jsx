import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Trash2,
  X,
  Archive,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import reviewService from '../../services/reviewService'
import { getUserIdentifier } from '../../services/userService'
import useCart from '../../hooks/useCart'
import { getReviewReaction, toggleVote } from '../../utils/reviewReactions'
import { formatPrice, averageRating } from '../../utils/helpers'

/**
 * Full-screen product detail view with Share, Cart, Review CRUD & Reactions.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger archive / delete flow
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Cart integration
  const { addToCart } = useCart()
  const [qty, setQty] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const handleAddToCart = () => {
    addToCart(gun, qty)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Review Edit State
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Review Reactions state trigger
  const [, setVoteTrigger] = useState(0)

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length
  const currentUserId = getUserIdentifier()

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: currentUserId,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  // Edit Review
  const startEditReview = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating || 5)
    setEditComment(rev.comment || '')
  }

  const handleSaveEditReview = async (reviewId) => {
    try {
      setSavingEdit(true)
      await reviewService.updateReview(reviewId, {
        rating: editRating,
        comment: editComment.trim(),
      })
      setEditingReviewId(null)
      refetchReviews()
    } catch (err) {
      alert(err.message || 'Failed to update review.')
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete Review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    try {
      await reviewService.deleteReview(reviewId)
      refetchReviews()
    } catch (err) {
      alert(err.message || 'Failed to delete review.')
    }
  }

  // Vote Thumbs Up / Down
  const handleVote = (reviewId, type) => {
    toggleVote(reviewId, type)
    setVoteTrigger((prev) => prev + 1)
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} loading="lazy" />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          {/* Cart Quantity & Add Button */}
          <div className="detail-cart-bar">
            <div className="qty-control">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="qty-num">{qty}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              className={`btn btn--primary btn-add-cart ${addedToCart ? 'btn-add-cart--added' : ''}`}
              onClick={handleAddToCart}
            >
              {addedToCart ? (
                <>
                  <Check size={16} /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={16} /> Add to Cart
                </>
              )}
            </button>
          </div>

          {/* Action Row: Favorite, Share, Edit, Archive */}
          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            <ShareButton gun={gun} showText />

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                <Edit2 size={15} /> Edit
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => onDelete(gun)}
                title="Archive or delete hardware"
              >
                <Archive size={15} /> Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews &amp; Field Reports</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a field review or operational notes…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button type="submit" className="btn btn--primary" disabled={submitting || !gun.id}>
            {submitting ? (
              <>
                <Loader size={16} className="spin" /> Submitting…
              </>
            ) : (
              <>
                <Send size={16} /> Submit Review
              </>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const reactions = getReviewReaction(rev.id)
              const isEditing = editingReviewId === rev.id

              return (
                <li key={rev.id} className="review-item">
                  <div className="review-head">
                    <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>

                    {/* Star Display */}
                    {!isEditing && (
                      <span className="review-stars-display">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < rev.rating ? 'var(--brass)' : 'none'}
                            stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                          />
                        ))}
                      </span>
                    )}

                    {/* Actions for review author / operator */}
                    <div className="review-item-actions">
                      <button
                        type="button"
                        className="btn-icon-subtle"
                        onClick={() => (isEditing ? setEditingReviewId(null) : startEditReview(rev))}
                        title="Edit review"
                      >
                        {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                      </button>
                      <button
                        type="button"
                        className="btn-icon-subtle btn-icon-subtle--danger"
                        onClick={() => handleDeleteReview(rev.id)}
                        title="Delete review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {isEditing ? (
                    <div className="review-edit-box">
                      <div className="review-stars review-stars--sm">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        maxLength={500}
                      />
                      <div className="review-edit-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={savingEdit}
                          onClick={() => handleSaveEditReview(rev.id)}
                        >
                          {savingEdit ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingReviewId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    rev.comment && <p className="review-comment">{rev.comment}</p>
                  )}

                  {/* Thumbs Up / Down Bar */}
                  <div className="review-votes-bar">
                    <button
                      type="button"
                      className={`vote-btn ${reactions.userVote === 'up' ? 'vote-btn--active' : ''}`}
                      onClick={() => handleVote(rev.id, 'up')}
                      title="Helpful"
                    >
                      <ThumbsUp size={14} />
                      <span>{reactions.thumbsUp || 0}</span>
                    </button>

                    <button
                      type="button"
                      className={`vote-btn ${reactions.userVote === 'down' ? 'vote-btn--active-down' : ''}`}
                      onClick={() => handleVote(rev.id, 'down')}
                      title="Not helpful"
                    >
                      <ThumbsDown size={14} />
                      <span>{reactions.thumbsDown || 0}</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first to field-test this hardware!</p>
        )}
      </section>
    </div>
  )
}
