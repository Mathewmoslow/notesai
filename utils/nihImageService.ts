export interface NIHImageSearchParams {
  query: string;
  start?: number;
  count?: number;
  articleType?: string;
  collection?: string;
  rankBy?: string;
  searchIn?: string;
  imageType?: string;
  license?: string;
  specialty?: string;
}

export interface NIHImageResult {
  pmcid?: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  source: string;
  license?: string;
  articleUrl?: string;
  authors?: string[];
  journal?: string;
  publishedDate?: string;
  specialty?: string;
  keywords?: string[];
}

export interface NIHSearchResponse {
  results: NIHImageResult[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
}

class NIHImageService {
  private readonly baseUrl = 'https://openaccess-api.nih.gov/api/search';

  private buildSearchUrl(params: NIHImageSearchParams): string {
    const searchParams = new URLSearchParams();

    searchParams.append('query', params.query);
    searchParams.append('m', (params.start || 1).toString());
    searchParams.append('n', (params.count || 10).toString());

    if (params.articleType) searchParams.append('at', params.articleType);
    if (params.collection) searchParams.append('coll', params.collection);
    if (params.rankBy) searchParams.append('favor', params.rankBy);
    if (params.searchIn) searchParams.append('fields', params.searchIn);
    if (params.imageType) searchParams.append('it', params.imageType);
    if (params.license) searchParams.append('lic', params.license);
    if (params.specialty) searchParams.append('sp', params.specialty);

    return `${this.baseUrl}?${searchParams.toString()}`;
  }

  async searchImages(params: NIHImageSearchParams): Promise<NIHSearchResponse> {
    try {
      const url = this.buildSearchUrl(params);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Medical-Notes-AI/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`NIH API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data, params);
    } catch (error) {
      console.error('Error searching NIH images:', error);
      throw new Error('Failed to search medical images');
    }
  }

  private parseResponse(data: any, params: NIHImageSearchParams): NIHSearchResponse {
    const results: NIHImageResult[] = [];

    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        if (item.images && item.images.length > 0) {
          for (const image of item.images) {
            results.push({
              pmcid: item.pmcid,
              title: item.title || 'Untitled',
              description: item.abstract || item.description,
              imageUrl: image.fullUrl || image.url,
              thumbnailUrl: image.thumbnailUrl || image.smallUrl,
              source: 'NIH Open Access',
              license: item.license || 'Open Access',
              articleUrl: item.articleUrl || `https://www.ncbi.nlm.nih.gov/pmc/articles/${item.pmcid}/`,
              authors: item.authors,
              journal: item.journal,
              publishedDate: item.publishedDate,
              specialty: item.specialty,
              keywords: item.keywords || []
            });
          }
        }
      }
    }

    return {
      results,
      totalCount: data.totalCount || 0,
      currentPage: Math.floor((params.start || 1) / (params.count || 10)) + 1,
      hasMore: results.length === (params.count || 10)
    };
  }

  async searchByMedicalTerm(term: string, specialty?: string): Promise<NIHSearchResponse> {
    return this.searchImages({
      query: term,
      count: 20,
      collection: 'pmc',
      imageType: 'ph,mc,g,x',
      license: 'by',
      specialty: specialty,
      rankBy: 'r'
    });
  }

  async searchForDiagrams(condition: string): Promise<NIHSearchResponse> {
    return this.searchImages({
      query: `${condition} diagram OR ${condition} pathophysiology OR ${condition} anatomy`,
      count: 15,
      collection: 'pmc,hmd',
      imageType: 'g,mc',
      license: 'by',
      rankBy: 'r'
    });
  }

  async searchForClinicalImages(condition: string): Promise<NIHSearchResponse> {
    return this.searchImages({
      query: `${condition} clinical OR ${condition} manifestation OR ${condition} symptoms`,
      count: 15,
      collection: 'pmc,cxr',
      imageType: 'ph,x',
      license: 'by',
      rankBy: 'r'
    });
  }
}

export const nihImageService = new NIHImageService();
export default nihImageService;