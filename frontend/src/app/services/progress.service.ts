import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { transitionValue } from '../transition-numbers.pipe';

export type ProgressValue = number | 'indeterminate' | 'hide';

const animationTime = 200; // ms

interface IProgressService {
    next(session: ProgressSession, percentage: number, endWith?: ProgressValue);
    hide(session: ProgressSession,);
    complete(session: ProgressSession,);
    indeterminate(session: ProgressSession,);
}

@Injectable({
    providedIn: 'root'
})
export class ProgressService implements OnDestroy {
    private value = new BehaviorSubject<ProgressValue>('hide');
    private transitionSubscription: Subscription = undefined;

    /**
     * only emit the values of the last session
     */
    private sessions: ProgressSession[] = [];
    value$ = this.value.asObservable();

    start(indeterminate = false): ProgressSession {
        const session = new ProgressSession(indeterminate ? 'indeterminate' : 0, {
            next: (session, percentage, endWith) => this.next(session, percentage, endWith),
            hide: (session) => this.hide(session),
            complete: (session) => this.complete(session),
            indeterminate: (session) => this.indeterminate(session)
        });
        if (this.sessions.length === 0) {
            this.value.next(session.value);
        }
        this.sessions.push(session);
        return session;
    }

    private next(session: ProgressSession, percentage: number, endWith?: ProgressValue) {
        if (!this.activeSession(session)) {
            // not the active session; that session jumps to its end value without transition
            return;
        }

        if (percentage !== this.value.value) {
            this.transitionSubscription?.unsubscribe();
            let startValue: number;

            switch (this.value.value) {
                case 'hide':
                case 'indeterminate':
                    startValue = 0;
                    break;

                default:
                    startValue = this.value.value;
                    break;
            }

            this.transitionSubscription = transitionValue(startValue, percentage, animationTime, endWith ?? percentage).subscribe(
                value => {
                    if (value === 'hide') {
                        // clear session
                        const sessionIndex = this.sessions.indexOf(session);
                        this.sessions.splice(sessionIndex, 1);

                        if (this.sessions.length) {
                            // emit the value of the current session instead
                            value = this.sessions[this.sessions.length - 1].value;
                        }
                    }

                    this.value.next(value);
                }
            );
        }
    }

    /**
     * Hides the current progress without showing any progress (to completion)
     * @param session
     */
    private hide(session: ProgressSession) {
        if (!this.activeSession(session)) {
            // not the active session
            return;
        }

        this.value.next('hide');
    }

    private complete(session: ProgressSession) {
        this.next(session, 100, 'hide');
    }

    private indeterminate(session: ProgressSession) {
        if (this.activeSession(session)) {
            this.transitionSubscription?.unsubscribe();
            this.value.next('indeterminate');
        }
    }

    /**
     * Checks if the passed progress session is active; adds the session
     * if it has been restarted
     * @param session session to check
     * @returns true if active
     */
    private activeSession(session: ProgressSession) {
        const sessionIndex = this.sessions.indexOf(session);
        if (sessionIndex === -1) {
            // restarted session
            this.sessions.push(session);
            return true;
        } else if (sessionIndex !== this.sessions.length - 1) {
            // not the active session
            return false
        }

        return true;
    }

    ngOnDestroy(): void {
        this.transitionSubscription?.unsubscribe();
    }
}

export class ProgressSession {
    get value(): ProgressValue {
        return this._value;
    }

    constructor(private _value: ProgressValue, private service: IProgressService) {
    }

    next(count: number, total: number) {
        let percentage: number;
        if (total <= 0) {
            percentage = 0;
        } else {
            percentage = Math.ceil((count / total) * 100);
        }
        this._value = percentage;

        this.service.next(this, percentage);
    }

    hide() {
        this._value = 'hide';
        this.service.hide(this);
    }

    complete() {
        this._value = 'hide';
        this.service.complete(this);
    }

    indeterminate() {
        this._value = 'indeterminate';
        this.service.indeterminate(this);
    }
}
