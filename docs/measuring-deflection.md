# Measuring deflection without fooling yourself

Every AI support vendor quotes a deflection number. Very few of them will tell you the denominator, and that is not an accident.

I ran customer self-service at Zoom while it went from 10 million to 300 million users. Deflection was the number that justified the program, which meant it was also the number under the most pressure to look good. This is what I learned about computing it in a way that survives someone asking how you got it.

## The arithmetic problem

The formula you will most often find, when you go looking, is some version of this:

```
deflection = deflected / tickets
```

It is wrong in a specific and instructive way. A deflected question, by definition, never becomes a ticket. So the numerator and the denominator are drawn from disjoint populations, and three bad things follow.

**It is unbounded.** Deflect 70 conversations, open 30 tickets, and you report 233%. Any metric that can exceed 100% is not measuring a share of anything.

**It moves twice for one cause.** Publish a genuinely good help article. More questions deflect, so the numerator rises. Fewer tickets open, so the denominator falls. The rate jumps for two reasons that are actually the same reason, and the size of the jump has no interpretation.

**It cannot be compared.** Not across quarters, not against another team, not against a vendor's case study. Two orgs with identical systems and different ticket mixes will report wildly different numbers.

The fix is small:

```
deflection = deflected / (deflected + escalated)
```

Count over **conversations**, not tickets. Every conversation ends exactly one way: the assistant answered it, or a human got involved. Log one outcome event per conversation and divide. The result is bounded in [0, 1], it moves once per cause, and it means one thing: of everyone who asked, this fraction got an answer without a human.

That is maybe a two-hour change in most codebases. It is also the easy part.

## The harder problem

"Deflection" is a claim about a world that did not happen. It asserts: *this contact would have become a ticket, and it didn't.*

That is a counterfactual, and you cannot observe a counterfactual. You can only estimate it.

The conversation-denominated formula quietly assumes that every question asked would otherwise have become a ticket. That assumption is false, and not by a little. A large share of help-center traffic is browsing, half-curiosity, and people who would have shrugged and moved on. Counting all of them as deflections inflates the number, sometimes enormously.

So the corrected formula still overstates. It is bounded and comparable, which is a real improvement over the alternative, but it is not the causal truth. Anyone who tells you their deflection number *is* the causal truth either has a holdout group or has not thought about it.

## What actually gets you closer

**Run a holdout.** Withhold the assistant from a random slice of traffic and compare ticket rates between the groups. This is the only clean measurement. It is operationally annoying and politically uncomfortable, because it means deliberately giving some customers a worse experience, and because it can return a number far below what the dashboard was claiming. It is also the only thing that answers the question you are actually asking. If a vendor has never run one, their number is an estimate wearing a lab coat.

**Track escalation-after-deflection.** Did a "deflected" user open a ticket forty minutes later? That was not a deflection. It was a delay, and it is usually worse than an immediate escalation, because you added friction to a contact that was going to happen anyway. This is cheap to measure and almost nobody does it, which tells you something about who the metric is really for.

**Never report deflection without satisfaction.** A customer who gave up in frustration and a customer who got a perfect answer look identical in the data. Both are "deflected." Deflection without a paired CSAT or thumbs signal is indistinguishable from abandonment, and abandonment does not disappear. It reappears later as churn, on someone else's dashboard.

**Sessionize honestly.** Someone who asks the same question three different ways and then opens a ticket is one failed conversation, not two deflections and an escalation. Naive per-message event counting reports 67% deflection on what was, end to end, a total failure. Where you draw the session boundary can move your headline number by ten points or more, which is why the boundary should be written down somewhere.

**Segment by answerability.** Not every question can be deflected, and the ones that cannot are not evenly distributed. If your question mix shifts toward the genuinely novel, perhaps because the routine questions are now being handled, your rate falls while your system improves. A single global number hides this and will eventually get you asked a question you cannot answer.

## What SupportLoop does, and what it still doesn't

[SupportLoop](https://support.aidancrosbie.com) computes the conversation-denominated version:

- Every conversation logs exactly one outcome event, `deflection` or `escalation`. Not "most" conversations. Every one, including tickets that are still open, because an open ticket is an escalated conversation and dropping it from the denominator inflates the rate.
- The rate is `deflected / (deflected + escalated)`, in [`lib/deflection.ts`](../lib/deflection.ts), as a pure function with tests. One of those tests asserts the result stays bounded in [0, 1], because the failure mode this whole document is about shows up as a number above 100%.
- The denominator is printed on the dashboard next to the number, not hidden in a tooltip.
- Ticket metrics exclude deflected conversations, so "Tickets" means escalations and the volume chart means ticket volume.
- When nothing was measured, the rate renders as `—` rather than `0%`. An unmeasured period displayed as zero is its own small lie.

What it does not do: there is no holdout group, no escalation-after-deflection window, and no sessionization. It reports the bounded, comparable, honest-denominator version, not the causal one.

That gap is the point. A deflection number is not wrong because someone was dishonest. It is wrong because the honest version is harder to compute, easier to argue with, and smaller. The number that can only go up will only go up, and the program will look successful right up until the day somebody asks how it was calculated.

Report the one that survives the question.

---

*Aidan Crosbie. The implementation is in [SupportLoop](https://github.com/acrosbie/supportloop), an AI customer-support platform built as a case study.*
