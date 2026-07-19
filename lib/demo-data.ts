export interface DemoMeeting {
  label: string;
  date: string;
  transcript: string;
}

export const DEMO_MEETINGS: DemoMeeting[] = [
  {
    label: "Sprint Planning",
    date: "2026-06-29",
    transcript: `Dev: Alright, let's lock the plan for this sprint. Priya, what's your top item?
Priya: I'll send the updated pricing deck to the sales team by Wednesday. They're blocked on the enterprise tier numbers.
Dev: Good. Rahul?
Rahul: I'll fix the checkout bug and get it deployed before Friday's demo. It's the one where the discount code doubles up.
Dev: Great, that one's been open too long. Meera?
Meera: I'll follow up with the AWS rep about the startup credits by end of week. We're leaving money on the table.
Dev: Perfect. And I'll own the Q3 roadmap draft, aiming to close it out by next Monday so we can review it as a team.
Priya: Sounds good, see everyone next week.`,
  },
  {
    label: "Weekly Sync",
    date: "2026-07-06",
    transcript: `Dev: Quick recap before we dive in. Rahul, did the checkout fix ship?
Rahul: Yep, deployed last Thursday, verified in prod, no more double discounts. Also picked up a new one — I'll write the postmortem for that bug by this Friday so we don't repeat it.
Dev: Nice work. Meera, how's the customer interview scheduling going? I know that's new this week.
Meera: I'll get the calls booked by next week, reaching out to the shortlist today.
Dev: Okay. I haven't started the roadmap draft yet honestly, still owe that one — this week for real.
Priya: I've been slammed with the renewal calls, pricing deck is still on my list.
Dev: Let's keep moving, we'll catch up on the rest next time.`,
  },
  {
    label: "Weekly Sync",
    date: "2026-07-13",
    transcript: `Dev: Let's go around. Priya, pricing deck?
Priya: Sent it out yesterday, sales team has it now, sorry for the delay.
Dev: All good, thank you. Meera, AWS credits — did that ever land?
Meera: Oh — honestly I forgot about that one completely. Let me get it done this week, no excuse.
Dev: Please do, we've been meaning to close that for two sprints now. Interview calls?
Meera: Those are booked, five calls scheduled for next week.
Dev: Great. And... I still haven't touched the roadmap draft. That's on me, three weeks running now. I'll block time tomorrow morning, no more slipping it.
Rahul: Postmortem doc is done, linked it in the channel this morning.
Priya: We should probably talk about why the roadmap keeps slipping, not just when.
Dev: Fair. Let's put fifteen minutes on that next time.`,
  },
];
