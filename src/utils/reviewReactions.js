// ---------------------------------------------------------------------------
// reviewReactions.js — Persists thumbs up / thumbs down for reviews
// ---------------------------------------------------------------------------

const REACTIONS_KEY = 'bore_barrel_review_reactions'

export const getReactions = () => {
  try {
    const raw = localStorage.getItem(REACTIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const getReviewReaction = (reviewId) => {
  const map = getReactions()
  return map[String(reviewId)] || { thumbsUp: 0, thumbsDown: 0, userVote: null }
}

export const toggleVote = (reviewId, voteType) => {
  // voteType: 'up' | 'down'
  const map = getReactions()
  const current = map[String(reviewId)] || { thumbsUp: 0, thumbsDown: 0, userVote: null }

  let { thumbsUp, thumbsDown, userVote } = current

  if (userVote === voteType) {
    // Un-vote
    if (voteType === 'up') thumbsUp = Math.max(0, thumbsUp - 1)
    if (voteType === 'down') thumbsDown = Math.max(0, thumbsDown - 1)
    userVote = null
  } else {
    // Switch or new vote
    if (userVote === 'up') thumbsUp = Math.max(0, thumbsUp - 1)
    if (userVote === 'down') thumbsDown = Math.max(0, thumbsDown - 1)

    if (voteType === 'up') thumbsUp += 1
    if (voteType === 'down') thumbsDown += 1
    userVote = voteType
  }

  map[String(reviewId)] = { thumbsUp, thumbsDown, userVote }
  try {
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }

  return map[String(reviewId)]
}
