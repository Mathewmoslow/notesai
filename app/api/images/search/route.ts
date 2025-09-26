import { NextRequest, NextResponse } from 'next/server';
import { nihImageService, NIHImageSearchParams } from '@/utils/nihImageService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: NIHImageSearchParams = {
      query: searchParams.get('query') || '',
      start: searchParams.get('start') ? parseInt(searchParams.get('start')!) : 1,
      count: searchParams.get('count') ? parseInt(searchParams.get('count')!) : 10,
      articleType: searchParams.get('articleType') || undefined,
      collection: searchParams.get('collection') || undefined,
      rankBy: searchParams.get('rankBy') || undefined,
      searchIn: searchParams.get('searchIn') || undefined,
      imageType: searchParams.get('imageType') || undefined,
      license: searchParams.get('license') || undefined,
      specialty: searchParams.get('specialty') || undefined,
    };

    if (!params.query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const results = await nihImageService.searchImages(params);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in image search API:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchType, term, specialty } = body;

    let results;

    switch (searchType) {
      case 'medical-term':
        results = await nihImageService.searchByMedicalTerm(term, specialty);
        break;
      case 'diagrams':
        results = await nihImageService.searchForDiagrams(term);
        break;
      case 'clinical':
        results = await nihImageService.searchForClinicalImages(term);
        break;
      default:
        results = await nihImageService.searchImages({
          query: term,
          specialty: specialty,
          count: 15
        });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in image search API:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}