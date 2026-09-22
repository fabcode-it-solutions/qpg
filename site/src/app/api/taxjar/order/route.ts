import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { 
  taxJarService, 
  createOrderRequest,
  BillingAddress,
  OrderItem 
} from '@/lib/taxjar';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      transactionId, 
      billingAddress, 
      items, 
      taxAmount, 
      shipping = 0, 
      customerId,
      transactionDate 
    } = await req.json();

    // Validate required fields
    if (!transactionId || !billingAddress || !items || taxAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, billingAddress, items, taxAmount' },
        { status: 400 }
      );
    }

    // Check if TaxJar is configured
    if (!taxJarService.isConfigured()) {
      console.warn('TaxJar not configured, skipping order creation');
      return NextResponse.json({
        success: true,
        message: 'Order tracking not available',
      });
    }

    // Create order request
    const orderRequest = createOrderRequest(
      transactionId,
      billingAddress as BillingAddress,
      items as OrderItem[],
      taxAmount,
      shipping,
      customerId || session.user.id,
      transactionDate ? new Date(transactionDate) : undefined
    );

    // Create order in TaxJar
    const result = await taxJarService.createOrder(orderRequest);

    if (!result.success) {
      console.error('Order creation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Order creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
    });

  } catch (error) {
    console.error('Order creation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, ...updateData } = await req.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing required field: transactionId' },
        { status: 400 }
      );
    }

    // Check if TaxJar is configured
    if (!taxJarService.isConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Order tracking not available',
      });
    }

    // Update order in TaxJar
    const result = await taxJarService.updateOrder(transactionId, updateData);

    if (!result.success) {
      console.error('Order update failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Order update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
    });

  } catch (error) {
    console.error('Order update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: transactionId' },
        { status: 400 }
      );
    }

    // Check if TaxJar is configured
    if (!taxJarService.isConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Order tracking not available',
      });
    }

    // Delete order from TaxJar
    const result = await taxJarService.deleteOrder(transactionId);

    if (!result.success) {
      console.error('Order deletion failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Order deletion failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
    });

  } catch (error) {
    console.error('Order deletion API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}