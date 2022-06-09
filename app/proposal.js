import './proposal.css';

export default function build(
  { proposal: { question, yesCount, noCount }, hasVoted, isOpen },
  id
) {
  console.log('id', id);
  const cancelVoteButton = `<div id="cancel-${id}" class="button cancel-vote">Cancel Vote</div>`;
  const voteActions = `<div class="vote-actions">
  <div id="yes-${id}" class="button vote-yes"> Vote Yes </div>
  <div id="no-${id}" class="button vote-no"> Vote No </div>
  ${hasVoted ? cancelVoteButton : ''}
  </div>`;

  const yesWin = `<div>The proposal is accepted!</div>`;
  const noWin = `<div>The proposal is rejected!</div>`;
  const voteResults = `<div>
  <div>Vote Results</div>
  ${yesCount > noCount ? yesWin : noWin}
  </div>`;

  return `
    <div class="proposal">
      <div class="question"> ${question} </div>
      <div class="counts">
        <div class="yes-count"> Yes: ${yesCount} </div>
        <div class="no-count"> No: ${noCount} </div>
      </div>
      ${isOpen ? voteActions : voteResults}
    </div>
  `;
}
