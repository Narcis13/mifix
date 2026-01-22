import Decimal from "decimal.js";

// Configure decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Money class wraps decimal.js for safe financial calculations.
 *
 * Usage:
 * - Create from string (preferred): new Money("100.50")
 * - Create from database: Money.fromDb("100.50")
 * - Arithmetic: money.plus(other), money.minus(other), money.times(n), money.dividedBy(n)
 * - Output: money.toDbString() for database, money.toDisplay() for UI
 *
 * NEVER use JavaScript numbers for monetary calculations!
 */
export class Money {
  private value: Decimal;

  constructor(value: string | number | Decimal) {
    // Always convert numbers to string first to avoid precision loss
    this.value = new Decimal(
      typeof value === "number" ? value.toString() : value
    );
  }

  // Arithmetic operations - return new Money instances (immutable)
  plus(other: Money | string | number): Money {
    const otherValue =
      other instanceof Money ? other.value : new Decimal(other);
    return new Money(this.value.plus(otherValue));
  }

  minus(other: Money | string | number): Money {
    const otherValue =
      other instanceof Money ? other.value : new Decimal(other);
    return new Money(this.value.minus(otherValue));
  }

  times(multiplier: number | string): Money {
    return new Money(this.value.times(new Decimal(multiplier)));
  }

  dividedBy(divisor: number | string): Money {
    return new Money(this.value.dividedBy(new Decimal(divisor)));
  }

  // Output methods
  toDbString(): string {
    return this.value.toFixed(2);
  }

  toDisplay(decimals: number = 2): string {
    return this.value.toFixed(decimals);
  }

  toNumber(): number {
    return this.value.toNumber();
  }

  toJSON(): string {
    return this.toDbString();
  }

  // Comparison methods
  equals(other: Money): boolean {
    return this.value.equals(other.value);
  }

  greaterThan(other: Money): boolean {
    return this.value.greaterThan(other.value);
  }

  lessThan(other: Money): boolean {
    return this.value.lessThan(other.value);
  }

  greaterThanOrEqualTo(other: Money): boolean {
    return this.value.greaterThanOrEqualTo(other.value);
  }

  lessThanOrEqualTo(other: Money): boolean {
    return this.value.lessThanOrEqualTo(other.value);
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isPositive(): boolean {
    return this.value.isPositive();
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  // Static factory methods
  static fromDb(dbValue: string): Money {
    return new Money(dbValue);
  }

  static zero(): Money {
    return new Money("0");
  }

  // Calculate monthly depreciation (linear method)
  static calculateMonthlyDepreciation(
    purchaseValue: Money,
    usefulLifeMonths: number
  ): Money {
    return purchaseValue.dividedBy(usefulLifeMonths);
  }
}
