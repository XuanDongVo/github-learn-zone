import {describe,it,expect} from 'vitest';
import {ACTIVITIES,startSession,submitAnswer} from '@/lib/mock';
import {supportedModes} from '@/lib/domain';
const activity=ACTIVITIES[0];
if(!activity) throw new Error('Missing fixture');
describe('Prototype practice rules',()=>{
 it('allows at most two learning attempts',()=>{const s=startSession(activity,'LEARNING','RANDOM');const first=submitAnswer(s,1,['B']);expect(first.feedback.retryAvailable).toBe(true);const second=submitAnswer(first.session,1,['C']);expect(second.feedback.retryAvailable).toBe(false);expect(second.session.questions[0]?.answerAttempts).toBe(2);expect(second.feedback.answerRevealed).toBe(true);});
 it('consumes one life for wrong Try Hard answers',()=>{const s=startSession(activity,'TRY_HARD','RANDOM');expect(submitAnswer(s,1,['B']).session.lives).toBe(2);});
 it('does not consume a life on timeout',()=>{const s=startSession(activity,'TRY_HARD','RANDOM');expect(submitAnswer(s,1,null).session.lives).toBe(3);});
 it('only offers supported activity modes',()=>{expect(supportedModes('LEARNING')).toEqual(['LEARNING']);expect(supportedModes('TRY_HARD')).toEqual(['TRY_HARD']);expect(supportedModes('BOTH')).toEqual(['LEARNING','TRY_HARD']);});
});
