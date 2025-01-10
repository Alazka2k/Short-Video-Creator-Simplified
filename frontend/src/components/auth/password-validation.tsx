"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthError } from "@/lib/errors/auth";

interface PasswordValidationProps {
  password: string;
  lang?: 'en' | 'de';
}

interface ValidationRule {
  key: 'MIN_LENGTH' | 'COMPLEXITY';
  test: (password: string) => boolean;
  subRules?: {
    key: string;
    test: (password: string) => boolean;
  }[];
}

const validationRules: ValidationRule[] = [
  {
    key: 'MIN_LENGTH',
    test: (password) => password.length >= 8
  },
  {
    key: 'COMPLEXITY',
    test: (password) => {
      let score = 0;
      if (/[a-z]/.test(password)) score++; // lowercase
      if (/[A-Z]/.test(password)) score++; // uppercase
      if (/\d/.test(password)) score++;     // numbers
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++; // special chars
      return score >= 3; // Auth0 default requires at least 3 of these
    },
    subRules: [
      {
        key: 'LOWERCASE',
        test: (password) => /[a-z]/.test(password)
      },
      {
        key: 'UPPERCASE',
        test: (password) => /[A-Z]/.test(password)
      },
      {
        key: 'NUMBER',
        test: (password) => /\d/.test(password)
      },
      {
        key: 'SPECIAL',
        test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
      }
    ]
  }
];

export function PasswordValidation({ password, lang = 'en' }: PasswordValidationProps) {
  const getComplexityScore = () => {
    let score = 0;
    const complexityRule = validationRules[1];
    complexityRule.subRules?.forEach(rule => {
      if (rule.test(password)) score++;
    });
    return score;
  };

  return (
    <div className="space-y-4 text-sm">
      {validationRules.map(({ key, test, subRules }) => {
        const isValid = test(password);
        
        return (
          <div key={key} className="space-y-2">
            <div
              className={cn(
                "flex items-center space-x-2",
                isValid ? "text-success" : "text-muted-foreground"
              )}
            >
              {isValid ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span>{getAuthError(`PASSWORD_VALIDATION.${key}` as any, 'signup', lang)}</span>
            </div>

            {key === 'COMPLEXITY' && subRules && (
              <div className="ml-6 space-y-1 text-xs">
                <div className="mb-2">
                  <div className="text-muted-foreground mb-1">
                    {getComplexityScore()}/4 criteria met (minimum 3 required)
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        getComplexityScore() >= 3 ? "bg-success" : "bg-primary/50",
                        getComplexityScore() === 0 && "bg-destructive/50"
                      )}
                      style={{ width: `${(getComplexityScore() / 4) * 100}%` }}
                    />
                  </div>
                </div>
                {subRules.map(({ key: subKey, test: subTest }) => (
                  <div
                    key={subKey}
                    className={cn(
                      "flex items-center space-x-2",
                      subTest(password) ? "text-success" : "text-muted-foreground/60"
                    )}
                  >
                    {subTest(password) ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>{getAuthError(`PASSWORD_VALIDATION.${subKey}` as any, 'signup', lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 